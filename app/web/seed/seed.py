from models import Species, BirdFood, db
import logging
from util import build_hierarchy_tree


def dfs_traverse_and_insert(tree, parent_id=None):
    """
    Perform DFS traversal and insert records into the database.
    """
    for node_id, children in tree.items():
        # Create and insert the species record
        # Adjust name if necessary
        species = Species(name=node_id, parent_id=parent_id)
        db.session.add(species)
        db.session.flush()  # Flush to get the id without committing

        # Recursively insert children
        dfs_traverse_and_insert(children, species.id)


def seed_bird_food():
    foods = [
        {
            'name': 'Black-oil Sunflower Seeds',
            'description': 'High in energy with thin shells. Preferred food for cardinals, chickadees, finches, sparrows, and occasionally woodpeckers.',
            'image_url': 'data/images/food/black-oil-sunflower-seeds.jpg',
        },
        {
            'name': 'Cracked Corn',
            'description': 'Inexpensive grain attractive to doves, quail, and sparrows. Best mixed with millet.',
            'image_url': 'data/images/food/cracked-corn.jpg',
        },
        {
            'name': 'Fruit',
            'description': 'Attracts orioles, mockingbirds, catbirds, bluebirds, robins, and waxwings. Includes oranges, grapes, raisins.',
            'image_url': "data/images/food/fruit.jpg",
        },
        {
            'name': 'Hulled Sunflower Seeds',
            'description': '"No mess" sunflower without shells. Preferred by many birds but spoils quickly if wet.',
            'image_url': "data/images/food/hulled-sunflower-seeds.jpg",
        },
        {
            'name': 'Mealworms',
            'description': 'High protein larvae attracting chickadees, titmice, wrens, nuthatches, and especially bluebirds.',
            'image_url': "data/images/food/mealworms.jpg",
        },
        {
            'name': 'Millet',
            'description': 'Small, round grain favored by ground foraging birds like juncos and sparrows.',
            'image_url': "data/images/food/millets.jpg"
        },
        {
            'name': 'Nyjer',
            'description': 'Small seed from Africa attracting finches including American Goldfinch, Pine Siskin, and Common Redpoll.',
            'image_url': 'data/images/food/nyjer.jpg',
        },
        {
            'name': 'Peanuts',
            'description': 'Popular with jays, chickadees, nuthatches, and titmice. Can be offered shelled or unshelled.',
            'image_url': 'data/images/food/peanuts.jpg',
        },
        {
            'name': 'Safflower',
            'description': 'White sunflower-like seed attracting cardinals and other big-billed birds.',
            'image_url': "data/images/food/safflower.jpg",
        },
        {
            'name': 'Suet',
            'description': 'Beef kidney fat attractive to insect-eating birds. Available plain or in processed cakes with seeds.',
            'image_url': 'data/images/food/suet.jpg',
        }
    ]

    for food_data in foods:
        food = BirdFood(**food_data)
        db.session.add(food)


def seed():
    if not Species.query.first():
        logging.info('Seeding species hierarchy data...')
        tree = build_hierarchy_tree()
        dfs_traverse_and_insert(tree)
        db.session.commit()
        logging.info('Species seeding complete.')

    if not BirdFood.query.first():
        logging.info('Seeding bird food data...')
        seed_bird_food()
        db.session.commit()
        logging.info('Bird food seeding complete.')
